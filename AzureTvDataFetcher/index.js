const axios = require('axios').default;

module.exports = async function (context, req) {
    // context.log('JavaScript HTTP trigger function processed a request.');

    // const name = (req.query.name || (req.body && req.body.name));
    // const responseMessage = name
    //     ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    const tmdbApiBaseUrl = "https://api.themoviedb.org/3";
    const type = context.bindingData.type;
    const tmdbId = context.bindingData.id;

    if(type === "movie") {
        context.res = {
            status: 501,
            body: 'Movie fetching not currently supported'
        };
    } else {
        try {
            const showInfo = await axios.get(`${tmdbApiBaseUrl}/${type}/${tmdbId}?api_key=${process.env["TmdbApiKey"]}`);
            const appendToResponse = getTvAppendToResponse(showInfo.data);
            const fullShowInfo = await axios.get(`${tmdbApiBaseUrl}/${type}/${tmdbId}?append_to_response=${appendToResponse}&api_key=${process.env["TmdbApiKey"]}`)

            const responseMessage = `Getting info for a ${type} with TMDB ID ${tmdbId}: ${JSON.stringify(fullShowInfo.data)}`;
        
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: responseMessage,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch(err) {
            context.log(`Error fetching ${type} info for id ${tmdbId}: ${err}`);
            context.res = {
                status: err.response.status,
                body: err.response.data
            };
        }
    }
}

const getTvAppendToResponse = (showInfo) => {
    // Creates the query params that are used in the 'append_to_response'
    // TMDB API call to retrieve all of the required show information.
    // For TV shows this is just the season information
    const seasons = [];
    showInfo.seasons.map(season => {
        seasons.push(`season/${season.season_number}`);
    });

    return seasons.join(',');
};