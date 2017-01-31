# express-simple-controllers
Create super simple controllers for routing an express app.

### How to use
First off, initialize the controllers

```js
import initialize from "express-simple-controllers";
import express from "express";

const router = express.Router();

initialize(router);
```

Then create a `controllers` directory and add anything with an `_controller.js` suffix. e.g. `home_controller.js`.
Anything with that suffix will be added as a controller.

If you need to change the controller directory...

```js
initialize(router, { directory: "server/controllers" });
```

#### Basic
You can create controller methods in a few different ways.

```js
const show = {
  method: "GET",
  route: "/home",
  handler(req, res, next) {
    res.render("home");
  }
};

export { show };
```

#### Handler types
```js
const show = {
  method: "GET",
  route: "/home",
  handler: {
    json(req, res, next) {
      res.json({ home: "home" });
    }
    html(req, res, next) {
      res.render("home");
    }
  }
};

export { show };
```


#### Middleware and before
If you export a `before` function, it will run before every method in the file unless you pass a `skipBefore: true`.

```js
const before = (req, res, next) => {
  req.something = "a thing";
  next();
}

const show = {
  method: "GET",
  route: "/home",
  handler(req, res, next) {
    const { something } = req;

    res.render("home", { something });
  }
};

const showNoBefore = {
  method: "GET",
  route: "/home",
  skipBefore: true,
  handler(req, res, next) {
    // ...
  }
};

export {
  before,
  show,
  showNoBefore,
};
```

You can also pass an array of of middleware.

```js
const show = {
  method: "GET",
  route: "/home",
  middleware: [first, second(someOptions)],
  handler(req, res, next) {
    res.render("home");
  }
};

export { show };
```

### CRUD routes
You can also create a simple crud controller by creating named functions in the exports...

```js
// user_controller.js
const before = (req, res, next) => next();

// GET /user
const show = (req, res, next) => {};

// GET /users
const list = (req, res, next) => {};

// PUT /user
const update = (req, res, next) => {};

// POST /user
const create = (req, res, next) => {};

// DELETE /user
const delete = (req, res, next) => {};

export {
  show,
  list,
  update,
  create,
  delete
};
```

The prefix of the file sets the route, in the above case `/user` because the controller is named `user_controller.js`.


### Build
Will build to the `/dist` directory.

```shell
npm run build
```

### Running tests
```shell
npm run test
npm run test:ci # Runs in watch mode
```
