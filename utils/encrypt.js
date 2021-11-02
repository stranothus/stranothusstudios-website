const bcrypt = require("bcrypt");

/**
 * Generates a salt for a hash asynchronously
 * 
 * @param {number} s - The number to use for the salt
 * 
 * @returns {string} salt
 */
const genSalt = async s => {
    return await bcrypt.genSalt(s).catch(err => { throw err; });
};

/**
 * Generates a hash from a salt and string asynchronously
 * 
 * @param {string} hash - the string to hash
 * 
 * @param {string} salt - the salt
 * 
 * @returns {string} hash
 */
const genHash = async (hash, salt) => {
    return await bcrypt.hash(hash, salt).catch(err => { throw err; });
};

/**
 * Compares a string to a hash asynchronously
 * 
 * @param {string} string - the string to check
 * 
 * @param {string} hash - the hash to check against
 * 
 * @returns {boolean} matches
 */
const checkHash = async (string, hash) => {
    return await bcrypt.compare(string, hash).catch(err => { throw err; });
};

module.exports = {
    genSalt : genSalt,
    genHash : genHash,
    checkHash : checkHash
};