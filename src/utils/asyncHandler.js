const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err)=> next(err));
    };
};


export { asyncHandler }


// const asyncHandler = () => { }
//both are same
// const asyncHandler = (func) => { async()=>{} }
// const asyncHandler = (func) => async() => { }


// const asyncHandlers = (fn) => async (req, res, next)=>{

//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }