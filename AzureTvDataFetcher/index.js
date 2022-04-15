const axios = require('axios').default;

module.exports = async function (context, req) {
    // context.log('JavaScript HTTP trigger function processed a request.');

    // const name = (req.query.name || (req.body && req.body.name));
    // const responseMessage = name
    //     ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    const type = context.bindingData.type;
    const tmdbId = context.bindingData.id;
    
    try {
        const showInfoRes = await fetchShowInfo(tmdbId);
        const responseMessage = `Getting info for a ${type} with TMDB ID ${tmdbId}: ${showInfoRes.data}`;
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: responseMessage
        };
    } catch(err) {
        context.log(`Error fetching TV show info for id ${tmdbId}: ${err}`);
        context.res = {
            status: err.response.status,
            body: err.response.data
        };
    }
}

const fetchShowInfo = async (tmdbId) => {
    return await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env["TmdbApiKey"]}`);
};