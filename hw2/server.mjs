import { createServer } from 'node:http';

const server = createServer((request, response) => {

    console.log("");
    console.log("Url:", request.url);
    console.log("Method:", request.method);


    if (request.method === "GET" && (request.url === "/health/" || request.url === "/health")) {

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');

        var data = {
            status: 'OK',
        };

        response.end(JSON.stringify(data));
    } else {
        response.statusCode = 404;
        response.end("Error 404. Wrong address");
    }

});

// starts a simple http server locally on port 8000
server.listen(8000, '0.0.0.0', () => {
    console.log('Listening port 8000');
});