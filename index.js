require("dotenv").config();
const express = require("express");
const Person = require("./models/person");
const morgan = require("morgan");
const cors = require("cors");
const { DateTime } = require("luxon");
const PORT = process.env.PORT;
const app = express();

morgan.token("body", (req) => {
  return JSON.stringify(req.body);
});

app.use(cors());
app.use(express.json());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

app.use((request, response, next) => {
  const now = DateTime.local();
  const dateTime = now.toLocaleString(DateTime.DATETIME_FULL);
  request.receivedTimeStamp = dateTime;
  next();
});

app.use(express.static("dist"));

app.get("/api/info", (request, response) => {
  Person.find({}).then((people) => {
    response.send(
      `<p>Phone book has info for ${people.length} people<br></br><p>${request.receivedTimeStamp}</p></p>`
    );
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((people) => {
    response.json(people);
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      response.json(person);
    })
    .catch((err) => next(err));
});

app.post("/api/persons", function (request, response) {
  const body = request.body;
  if (!body) {
    return response.status(400).json({
      error: "Request body missing",
    });
  }
  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "Request body missing name or number",
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((err) => {
      response.status(400).send({ error: err.message });
    });
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((err) => next(err));
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;

  const person = {
    name: body.name,
    number: body.number,
  };
  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then((updatedPerson) => {
      response.json(updatedPerson);
    })
    .catch((err) => next(err));
});

const unknownEndPoint = (request, response) => {
  response.status(400).send({ error: "Unknown endpoint" });
};

app.use(unknownEndPoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(404).send({ error: "malformatted id" });
  }
  if (error.name === "ValidationError") {
    return response.status(400).send(error.message);
  }
  next(error);
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
