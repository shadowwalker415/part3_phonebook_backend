const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const url = process.env.MONGODB_URI;

console.log("connecting to databse url");

mongoose
  .connect(url)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((err) => {
    console.log("error connecting to MongoDB", err.message);
  });

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Person must have a name"],
    minlength: [3, "A person's name must be at least 3 characters long"],
  },
  number: {
    type: String,
    required: true,
    minlength: [8, "Phone numbers must be at least 8 characters long"],
    validate: {
      validator: function (v) {
        return /^\d{2,3}-\d{7,8}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number`,
    },
    required: [true, "Phone number is required"],
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = new mongoose.model("Person", personSchema);
