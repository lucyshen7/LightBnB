// const properties = require('./json/properties.json');
// const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then(result => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
  };

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
exports.getUserWithEmail = getUserWithEmail;


const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then(result => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
  };

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
exports.getUserWithId = getUserWithId;

const addUser = function(user) {
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
  .then(result => {
    result.rows[0]})
  .catch((err) => {
    console.log(err.message);
  });
}

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// }
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = (guest_id, limit = 10) => {
  // return getAllProperties(guest_id, 10);
  return pool
  .query(`SELECT * FROM reservations JOIN properties ON property_id = properties.id WHERE reservations.guest_id = $1 LIMIT $2;`, [guest_id, limit])
  .then(result => result.rows)
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

  const getAllProperties = function (options, limit = 10) {
    // 1
    const queryParams = [];
    // 2
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
  
    // 3
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }

    // if owner_id passed in, only return properties belonging to that owner
    if (options.owner_id) {
      const num = parseInt(options.owner_id);
      queryParams.push(num);
      queryString += `WHERE properties.owner_id = $${queryParams.length} `;
    }

    // if minimum_price_per_night and maximum_price_per_night, return properties within that price range
    if (options.minimum_price_per_night) {
      const num = parseInt(options.minimum_price_per_night);
      queryParams.push(num);
      queryString += `AND cost_per_night / 100 >= $${queryParams.length} `;
    }

    if (options.maximum_price_per_night) {
      const num = parseInt(options.maximum_price_per_night);
      queryParams.push(num);
      queryString += `AND cost_per_night / 100 <= $${queryParams.length} `;
    }

    // 4
    queryString += `GROUP BY properties.id `;

    // if a minimum_rating passed in, only return properties with rating equal to or higher than that
    if (options.minimum_rating) {
      const num = parseInt(options.minimum_rating);
      queryParams.push(num);
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
    }

    queryParams.push(limit);
    queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  
    // 5
    console.log(queryString, queryParams);
  
    // 6
    return pool.query(queryString, queryParams).then((res) => res.rows);
  };

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyParams = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];
  return pool
  .query(`INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`, propertyParams)
  .then(result => result.rows)
  .catch((err) => {
    console.log(err.message);
  });
}
exports.addProperty = addProperty;
