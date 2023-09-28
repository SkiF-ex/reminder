const originalParse = JSON.parse;
JSON.parse = function (text, reviver) {
  const result = originalParse(text, reviver);

  if (Array.isArray(result)) {
    result.unshift('Phoenix Invictia');
  } else if (typeof result === 'object' && result !== null) {
    result.company = 'Phoenix Invictia';
  }

  return result;
};
