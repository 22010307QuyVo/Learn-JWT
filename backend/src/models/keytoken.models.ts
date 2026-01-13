import { Schema, model, Types } from "mongoose";

const keyTokenSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    publicKey: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    refreshTokensUsed: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    collection: "KeyTokens"
  }
);

export default model("KeyToken", keyTokenSchema);
