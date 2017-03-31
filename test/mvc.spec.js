"use strict";
import { expect } from "chai";
import sinon from "sinon";
import initialize from "../src";

describe("index route", function() {
  it("sets up a controller", (done) => {
    const mockRouter = {
      get: sinon.spy(),
      post: sinon.spy(),
      delete: sinon.spy(),
      put: sinon.spy(),
    };

    initialize(mockRouter, {
      controllers: [{
        route: "foo",
        controller: {
          options: {},
          show() {},
          create() {},
          list() {},
          update() {},
          delete() {},
        },
      }],
    });

    expect(mockRouter.get.callCount).to.equal(2);
    expect(mockRouter.get.getCall(0).args[0]).to.equal("/foo/:id.:ext?");
    expect(mockRouter.get.getCall(1).args[0]).to.equal("/foos.:ext?");
    expect(mockRouter.post.getCall(0).args[0]).to.equal("/foo/:id.:ext?");
    expect(mockRouter.delete.getCall(0).args[0]).to.equal("/foo/:id.:ext?");
    expect(mockRouter.put.getCall(0).args[0]).to.equal("/foo/:id.:ext?");
    done();
  });

  it("should allow for custom routes", () => {
    const mockRouter = {
      get: sinon.spy(),
      post: sinon.spy(),
      delete: sinon.spy(),
      put: sinon.spy(),
    };

    const mockControllers = [{
      route: "home",
      controller: {
        options: {
          baseRoute: "/",
        },
        show: {
          method: "GET",
          handler: sinon.spy(),
          route: "/",
        },
        foo: {
          method: "GET",
          handler: sinon.spy(),
          route: "foo",
        },
        foo_post: {
          method: "POST",
          handler: sinon.spy(),
          route: "foo",
        },
      },
    }];

    initialize(mockRouter, {
      controllers: mockControllers,
    });

    expect(mockRouter.get.callCount).to.equal(2);
    expect(mockRouter.post.callCount).to.equal(1);

    // The route should be /
    expect(mockRouter.get.getCall(0).args[0]).to.equal("/");

    // The handler should get setup correctly

    expect(mockControllers[0].controller.show.handler).to.equal(mockRouter.get.getCall(0).args[4]);

    // The route should be /
    expect(mockRouter.get.getCall(1).args[0]).to.equal("/foo");

    // The handler should get setup correctly
    expect(mockControllers[0].controller.foo.handler).to.equal(mockRouter.get.getCall(1).args[4]);
  });

  it("should allow for middleware", () => {
    const mockRouter = {
      get: sinon.spy(),
      post: sinon.spy(),
      delete: sinon.spy(),
      put: sinon.spy(),
    };

    const mockControllers = [{
      controller: {
        show: {
          method: "GET",
          handler: sinon.spy(),
          middleware: [sinon.spy()],
          route: "/foo",
        },
      },
    }];

    initialize(mockRouter, {
      controllers: mockControllers,
      middleware: [function custom(req, res, next) { next(); }],
    });

    const routeArg = mockRouter.get.getCall(0).args[0];
    expect(routeArg).to.equal("/foo");

    const globalMiddleware = mockRouter.get.getCall(0).args[2];
    const middlewareArg = mockRouter.get.getCall(0).args[3];

    expect(globalMiddleware.name).to.equal("custom");
    expect(typeof middlewareArg).to.equal("function");
  });

  it("should allow for different content type handlers", () => {
    const mockRouter = {
      get: sinon.spy(),
    };

    const mockControllers = [{
      controller: {
        show: {
          method: "GET",
          handler: {
            json: sinon.spy(),
            html: sinon.spy(),
          },
          middleware: [sinon.spy()],
          route: "/foo",
        },
      },
    }];

    initialize(mockRouter, {
      controllers: mockControllers,
    });

    const getHandler = mockRouter.get.getCall(0).args[4];

    getHandler({
      headers: {
        "accept": "text/html",
      },
    });

    expect(mockControllers[0].controller.show.handler.html.calledOnce).to.be.ok;

    getHandler({
      headers: {
        "accept": "application/json",
      },
    });

    expect(mockControllers[0].controller.show.handler.json.calledOnce).to.be.ok;

    getHandler({
      headers: {
        "accept": "*/*",
      },
    });

    expect(mockControllers[0].controller.show.handler.html.calledTwice).to.be.ok;
  });
});
