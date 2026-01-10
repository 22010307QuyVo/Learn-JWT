import User from "../models/user.models"

export const userService = {
    getAllUsers: async () => {
        return User.find().select("-password");
    },

    deleteUserById: async (userId: string) => {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    return deletedUser;
  }
}