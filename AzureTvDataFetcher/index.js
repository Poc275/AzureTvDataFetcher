const axios = require('axios').default;

module.exports = async function (context) {
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
            const showInfoRes = await axios.get(`${tmdbApiBaseUrl}/${type}/${tmdbId}?api_key=${process.env["TmdbApiKey"]}`);
            const appendToResponse = getTvAppendToResponse(showInfoRes.data);
            const fullShowInfoRes = await axios.get(`${tmdbApiBaseUrl}/${type}/${tmdbId}?append_to_response=${appendToResponse}&api_key=${process.env["TmdbApiKey"]}`);
            const fullShowInfo = fullShowInfoRes.data;

            // write the show to table storage
            context.bindings.azuretvTableBinding = [];
            context.bindings.azuretvTableBinding.push({
                PartitionKey: "shows",
                RowKey: fullShowInfo.id,
                name: fullShowInfo.name,
                poster_path: fullShowInfo.poster_path,
                backdrop_path: fullShowInfo.backdrop_path || fullShowInfo.poster_path,
                tagline: fullShowInfo.tagline,
                overview: fullShowInfo.overview,
                number_of_episodes: fullShowInfo.number_of_episodes
            });

            // write the episodes to table storage
            fullShowInfo.seasons.forEach(season => {
                fullShowInfo[`season/${season.season_number}`].episodes.forEach(episode => {
                    context.bindings.azuretvTableBinding.push({
                        PartitionKey: "episodes",
                        RowKey: `${fullShowInfo.id}_${episode.season_number}_${episode.episode_number}`,
                        name: episode.name,
                        overview: episode.overview,
                        still_path: episode.still_path || fullShowInfo.poster_path,
                        air_date: episode.air_date,
                        episode_number: episode.episode_number,
                        season_number: episode.season_number
                    });
                });
            });

            // return response
            const responseMessage = `Inserted ${type} with TMDB ID ${tmdbId}: ${JSON.stringify(fullShowInfo)}`;
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
