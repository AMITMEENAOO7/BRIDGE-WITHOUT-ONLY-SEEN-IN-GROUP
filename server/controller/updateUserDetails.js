const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken")
const UserModel = require("../models/UserModel")

async function updateUserDetails(request,response){
    try {
        const token = request.cookies.token || ""

        const user = await getUserDetailsFromToken(token)

        const { name, profile_pic } = request.body; // Ensure this is correctly getting the data

        const updateUser = await UserModel.updateOne({ _id : user._id },{
            name,
            profile_pic
        });
        // Log the result to use the value
        console.log(updateUser);

        const userInfomation = await UserModel.findById(user._id)

        return response.json({
            message : "user update successfully",
            data : userInfomation,
            success : true
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}

module.exports = updateUserDetails
