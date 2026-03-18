require('./config/env');
const express = require('express');
const app = express();
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

function listRoutes(app) {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) { // routes registered directly on the app
            routes.push(middleware.route.stack[0].method.toUpperCase() + ' ' + middleware.route.path);
        } else if (middleware.name === 'router') { // router middleware 
            middleware.handle.stack.forEach(handler => {
                const route = handler.route;
                route && routes.push(route.stack[0].method.toUpperCase() + ' /api' + route.path);
            });
        }
    });
    return routes;
}

console.log('--- REQUERENDO ROTAS ---');
console.log(listRoutes(app).join('\n'));
process.exit(0);
