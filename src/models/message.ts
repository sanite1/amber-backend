import mongoose, { Schema, Document } from "mongoose";
import { IMessage } from "../interfaces/message.interface";
const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
