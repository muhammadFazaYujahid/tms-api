import nodemailer from "nodemailer";

const sendEmail = async (email, mailSubject, content, res) => {
    try {
        let transporter = nodemailer.createTransport({
            // for gmail
            service: "gmail",

            //temp service using ethereal email
            // host: 'smtp.ethereal.email',
            // port: 587,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASSWORD,
                // user: '',
                // pass: '',
            },
        });
        // transporter.verify((error, success) => {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         console.log("Ready for message");
        //         console.log(success);
        //     }
        // });
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: mailSubject,
            html: content,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('error', error);
                res.status(500).json({ error: error });
            } else {
                res.status(201).json({
                    message: "mail sent successfully",
                    info: info.response,
                });
            }
        });
    } catch (error) {
        console.log(error);
        // res.status(500).json({
        //     success: false,
        //     message: "Internal Server Error",
        //     error: error.message,
        // });
    }
};

export default sendEmail;
