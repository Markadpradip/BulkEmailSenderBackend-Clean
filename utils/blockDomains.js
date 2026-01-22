const blocked = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "fakeinbox.com",
  "yopmail.com",
];

module.exports = function isBlockedDomain(domain) {
  return blocked.includes(domain.toLowerCase());
};
