const asyncHandler = (requestHandler) => {
    return function (req, res, next) {
        Promise.resolve(requestHandler(req, res, next)).catch((error) =>
            res
                .status(error.statusCode || 500)
                .json({ success: false, message: error.message })
        );
    };
};

// Different syntax

// const asyncHandler = (requestHandler) => async (req, res, next) => {
//     try {
//         await requestHandler(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

export { asyncHandler };
