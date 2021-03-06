// @flow
/* eslint-disable global-require, import/no-dynamic-require */
import path from "path";
import fs from "fs";

const getControllers = (directory = "controllers") => {
  const controllerPath = path.join(process.cwd(), directory);
  const controllers = fs.readdirSync(controllerPath);

  return controllers
    .filter(c => !fs.lstatSync(`${controllerPath}/${c}`).isDirectory())
    .map((c) => {
      const controller = require(`${controllerPath}/${c}`);
      const options = controller.options || { baseRoute: "" };
      const name = c.replace(/_controller\.js$/, "");

      return {
        route: (options && options.baseRoute) || name,
        controller: Object.assign({}, controller, {
          options,
          name,
        }),
      };
    });
};


const controllerMiddleware = (controller: string, action: string) => (req, res, next) => {
  const request = req;

  request.controller = {
    name: controller,
    action,
  };

  next();
};

const allowedMethods = [{
  handler: "show",
  method: "get",
}, {
  handler: "list",
  method: "get",
}, {
  handler: "update",
  method: "put",
}, {
  handler: "create",
  method: "post",
}, {
  handler: "delete",
  method: "delete",
}];

export default function initialize(router, {
  controllers,
  directory,
  middleware = [],
} = {
  middleware: [],
}) {
  const parsedControllers = typeof controllers === "undefined" ?
    getControllers(directory) :
    controllers;

  parsedControllers.forEach((c) => {
    const controller = c.controller;
    const controllerOptions = controller.options || { baseRoute: "" };

    const route = controllerOptions.baseRoute || c.route;
    const nooptBefore = (req, res, _next) => { _next(); };
    const before = controller.before ? controller.before : nooptBefore;

    Object.keys(controller).filter(k => k !== "options").forEach((key) => {
      const handler = controller[key];

      if (typeof handler === "object") {
        const options = handler;
        const handlerRoute = options.route === "/" ? "" : options.route;
        const { baseRoute } = controllerOptions;
        const allMiddleware = [
          controllerMiddleware(controller.name, key),
          ...middleware,
          ...(!options.middleware ? [nooptBefore] : options.middleware),
          options.skipBefore ? nooptBefore : before,
        ];

        let handlerFn = options.handler;
        if (typeof options.handler === "object") {
          const handlerMap = {
            "application/json": "json",
            "text/html": "html",
          };

          handlerFn = (req, res, next) => {
            const accept = req.headers["accept"] || "text/html";

            const type = Object.keys(handlerMap).find(
              (h) => {
                if (accept.toLowerCase().indexOf(h) > -1) {
                  return handlerMap[h];
                }
                return null;
              },
            );
            const handlerType = handlerMap[type] || "html";
            if (handlerType && options.handler[handlerType]) {
              options.handler[handlerType](req, res, next);
            } else {
              next();
            }
          };
        }

        router[options.method.toLowerCase()](`${baseRoute}${handlerRoute}`,
          ...allMiddleware,
          handlerFn,
        );
      } else {
        const allowed = allowedMethods.filter(m => m.handler === key)[0];

        if (allowed) {
          if (key === "list") {
            router.get(`/${route}s.:ext?`,
              controllerMiddleware(controller.name, key),
              before,
              ...middleware,
              handler,
            );
          } else {
            router[allowed.method](`/${route}/:id.:ext?`,
              controllerMiddleware(controller.name, key),
              before,
              ...middleware,
              handler,
            );
          }
        }
      }
    });
  });
}
