const { analyzeImageSafety } = require("./ai_handlers");

const main = async () => {

    const parameters = {
        crowdType: 'good', // 'good', 'sketchy', 'risky'
        lightingCondition: 'moderate', // 'good', 'moderate', 'poor'
        visibleSecurity: true, // true or false,
        userType: 'he', // 'he', 'she', 'other'
        // Add more parameters as needed
    }

    const report = `the user is a ${parameters.userType} and the crowd is ${parameters.crowdType} with ${parameters.lightingCondition} lighting and visible security presence: ${parameters.visibleSecurity}`;

    const res = await analyzeImageSafety({
        imageUrl: "https://asset-main.s3.us-east-2.amazonaws.com/common_assets/1.jpg",
        userDescription: report
    })

    console.log("AI Analysis Result:", res);

    return res;

}

main().then(() => {
    console.log("AI handler completed successfully.");
}).catch(err => {
    console.error("Error in AI handler:", err);
});