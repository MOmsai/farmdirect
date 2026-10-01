const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: ['farmer', 'customer'],
    },

    // Customer profile
    phone: {
      type: String,
      default: '',
      trim: true,
    },

    profileImage: {
      type: String,
      default: '',
      trim: true,
    },

    // Farmer-only fields
    farmName: {
      type: String,
      required: function () {
        return this.role === 'farmer';
      },
    },

    farmLocation: {
      village: {
        type: String,
        required: function () {
          return this.role === 'farmer';
        },
      },

      city: {
        type: String,
        required: function () {
          return this.role === 'farmer';
        },
      },

      state: {
        type: String,
        required: function () {
          return this.role === 'farmer';
        },
      },

      pincode: {
        type: String,
        required: function () {
          return this.role === 'farmer';
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);