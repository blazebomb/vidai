import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

//defining the datatypes
export interface IUser {
  email: string;
  password: string;
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true, 
  }
);


// for the passowrd hashing (HOOK)
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        await bcrypt.hash(this.password, 10)
    }
    next()
})

export const User = models?.User || model<IUser>("User", userSchema)

export default User; 