import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt"

const generateRefreshAndAccessToken = async function (userId) {
    try {
        const user = await User.findOne(userId);
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, error.message || "Error generating refresh token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // TODO:
    // 1. get the data from user
    // 2. check user exist or not
    // 3.if not then we get the upload files
    // 4. then upload on server
    // 5. if successfully upload then we upload on cloudinary
    // 6.if successfully upload on cloudinary then we store the data in database
    // 7. send the response

    const { fullName, username, email, password } = req.body

    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }

    const avatarLP = req.files['avatar'][0].path
    let coverImageLP;
    if (req.files && req.files['coverImage'] && req.files['coverImage'].length > 0) {
        coverImageLP = req.files['coverImage'][0].path
    }
    if (!avatarLP) {
        throw new ApiError(404, "Avatar not found")
    }
    const avatar = await uploadToCloudinary(avatarLP)
    if (!avatar) {
        throw new ApiError(500, "Unable to upload avatar")
    }
    let coverImage;
    if (coverImageLP) {
        coverImage = await uploadToCloudinary(coverImageLP)
        if (!coverImage) {
            throw new ApiError(500, "Unable to upload cover image")
        }
    }

    const createdUser = await User.create({
        fullName,
        username,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : ""
    })
    if (!createdUser) {
        throw new ApiError(500, "Unable to create user")
    }
    const user = await User.findById(createdUser._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "Unable to find user")
    }
    res.status(201).json(new ApiResponse(201, "User created successfully", user))
})


const loginUser = asyncHandler(async (req, res) => {
    // TODO:
    // 1. get the data
    // 2. check user already exists or not 
    // 3. generate access refresh token
    // 4. send cookie  
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, " username or email is required")
    }
    if (!password) {
        throw new ApiError(400, " password is required")
    }

    const findUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!findUser) {
        throw new ApiError(404, "User not found")
    }
    const isMatchPassword = await findUser.comparePassword(password)
    if (!isMatchPassword) {
        throw new ApiError(400, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(findUser._id)

    const loggedInUser = await User.findById(findUser._id).select("-password -refreshToken")
    if (!loggedInUser) {
        throw new ApiError(500, " Unable to logged user")
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(201).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(201, "User logged in successfully", { user: loggedInUser, accessToken, refreshToken }))
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    })
    if (!user) {
        throw new ApiError(500, "Unable to logout user")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200).clearCookie("accessToken", options).json(new ApiResponse(200, "User logged out successfully"))
})
export { registerUser, loginUser, logoutUser }