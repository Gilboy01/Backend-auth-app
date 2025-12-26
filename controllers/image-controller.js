const Image = require("../models/image");
const {uploadToCloudinary} = require("../helpers/cloudinaryHelper");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// upload image controller
const uploadImageController = async (req, res) => {
    try {
        // check if file is missing in request object
        if(!req.file){
            return res.status(400).json({
                success: false,
                message: "File is required, please upload an image"
            })
        }
        // upload to cloudinary
        const {url, publicId} = await uploadToCloudinary(req.file.path);

        // store the image url and public id along with uploaded user id in database
        const newlyUploadedImage = new Image({
            url,
            publicId,
            uploadedBy: req.userInfo.userId
        });

        await newlyUploadedImage.save();

        // delete the file from local storage(uploads folder)
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            image: newlyUploadedImage
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong! Please try again"
        });
    }
};

// fetch images controller
const fetchImagesController = async(req,res) => {
    try {
        //implement paginess
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // by default display max of 5 images
        const skip = (page - 1) * limit;

        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
        const totalImages = await Image.countDocuments()
        const totalPages = Math.ceil(totalImages/limit)

        const sortObj = {};
        sortObj[sortBy] = sortOrder;

        //const images = await Image.find()
        const images = await Image.find().sort(sortObj).skip(skip).limit(limit);

        if(images){
            res.status(200).json({
                success: true,
                currentPage: page,
                totalPages: totalPages,
                totalImages: totalImages,
                data: images
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
        success: false,
        message: "something went wrong! Please try again"
        });
    }
};

// Delete image controller
const deleteImageController = async (req,res) => {
    try {
        const getCurrentImageId = req.params.id;
        const userId = req.userInfo.userId;

        const image = await Image.findById(getCurrentImageId);

        if(!image){
            return res.status(404).json({
                success: false,
                message: "Image not found"
            });
        }

        //  check if image was uploaded by current user
        if(image.uploadedBy.toString() !== userId){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this image"
            });
        }

        // delete image from cloudinary storage
        await cloudinary.uploader.destroy(image.publicId);

        // delete this image from mongodb database
        await Image.findByIdAndDelete(getCurrentImageId);

        res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
        success: false,
        message: "something went wrong! Please try again"
        });
    }
}

module.exports = {
    uploadImageController,
    fetchImagesController,
    deleteImageController,
};