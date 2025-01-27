import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const generateAccessAndRefreshTokens = async (userId) => {

    try {


        const user = await User.findById(userId)

        // console.log("hiiiiiiiii");
        // console.log(user);

        const accessToken = user.generateAccessToken()
        // console.log(accessToken, "accessToken");
        const refreshToken = user.generateRefreshToken()
        // console.log(refreshToken, "refreshToken");

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong")

    }


const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: 'ok'
    // })

    //get user details from frantend
    //validation - not empty
    //check if user already exists :username ,email
    //chexk for image, check for avatar
    //uplaod them to clodinary ,avatar
    // create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation `
    //return res
    // console.log('hii');

    const { username, email, fullName, password } = req.body

    // console.log("email :", email);
    // res.end("hello from user controller")

    // if (fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    console.log(typeof fullName === 'number', "yes it is a number");

    if (
        [fullName, email, password, username].some((field) =>
            field.trim() === "")
    ) {
        throw new ApiError(400, "all field are required  ")

    }


    const exitedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (exitedUser) {
        throw new ApiError(409, "user with email and username is already exist")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files.coverImage && req.files.coverImage[0] && req.files.coverImage[0].path) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // coverImageLocalPath = ""


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log(avatar);

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    // console.log("all fine");

    const user = await User.create({
        fullName,
        avatar: { url: avatar.secure_url, public_id: avatar.public_id },
        coverImage: {
            url: coverImage?.secure_url || "", public_id: coverImage.public_id
        },
        email,
        password,
        username: username.toLowerCase()
    })

    // console.log(user);

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken")

    // console.log(createdUser);


    if (!createdUser) {
        throw new ApiError(500, "Something went wrong")
    }
    // const { _id, name } = createdUser; // Pick only necessary fields
    // const userResponse = { _id, name };
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user Registered successfully")
    )


})






































const loginUser = asyncHandler(async (req, res) => {
    //req body data
    // username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(400, "User does not exist")
    }

    console.log(user);


    const isPasswordValid = await user.isPasswordCorrect(password)


    if (!isPasswordValid) {
        throw new ApiError(401, "password not correct")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggenInUser = await User.findById(user._id).select("-password -refreshToken",)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggenInUser, accessToken },
                "user logged ")
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id

    await User.findByIdAndUpdate(req.user._id,
        {
            $unset:
            {
                refreshToken: 1  // use this
            }
            // $set:
            // {
            //     refreshToken: undefined          // will not work because when mongoose see undefined the it didn't update you can use null but this is not good
            // }
        },
        {
            new: true
        })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // const incomingRefreshTokent = req.cookies.accessToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFERESH_TOKEN_SECRET)
        console.log(decodedToken);
        // const decodedTokent = jwt.verify(incomingRefreshTokent, process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedTokent);

        const user = await User.findById(decodedToken?._id).select('refreshToken')
        // console.log(user);



        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        console.log(incomingRefreshToken !== user?.refreshToken, "tokenssssssss");
        console.log(incomingRefreshToken);
        console.log(user?.refreshToken);

        // res.json(
        //     new ApiResponse(200, user, 'all fine')
        // )


        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expireshed or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        // console.log(user, "hello");

        const { newRefreshToken, newAccessToken } = await generateAccessAndRefreshTokens(user._id)
        // console.log(newAccessToken, "hello2");

        return res.status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refreshed token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    res.status(200).json(
        new ApiResponse(200, {}, "password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {

    // const user = await User.findById(req.user._id)

    res.status(200).json(
        new ApiResponse(
            200, req.user, "current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { email, fullName } = req.body;

    if (!fullName && !email) {
        throw new ApiError(400, "allfiels are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullName
            }

        },
        { new: true }).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "All details updated successfully")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    // console.log(req?.file);
    // console.log(req?.file?.path,"kkkk"); 

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar ")
    }

    //store avater publicid before update for deletion
    const oldUser = await User.findOne(req?._id).select("+avatar");
    console.log(oldUser);

    const avatarPublicId = oldUser.avatar.public_id

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: { url: avatar.secure_url, public_id: avatar.public_id },
            }
        },
        { new: true })
        .select("-password")
    console.log();

    //delete privious avatar
    if (avatarPublicId && user.avatar.public_id) {
        await deleteFromCloudinary(avatarPublicId)
        // const oldavt = await deleteFromCloudinary(avatarPublicId)
        // console.log(oldavt);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar upload successfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image  is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading coverimage")
    }

    const oldUser = await User.findOne(req?._id);
    console.log(oldUser);

    const coverImagePublicId = oldUser.coverImage.public_id


    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }).select("-password")

    //delte privious coverimage
    if (coverImagePublicId && user.coverImage.public_id) {
        await deleteFromCloudinary(coverImagePublicId)
        // const oldCOImg = await deleteFromCloudinary(coverImagePublicId)
        // console.log(oldCOImg);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage update successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username) {
        throw new ApiError(400, "username not fount")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribe: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribe: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log(channel[0]);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not found")
    }


    return res.status(200).json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {


    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    console.log(user);


    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "watch History fetched successsfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

