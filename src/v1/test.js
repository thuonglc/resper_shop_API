function limit(c) {
  return this.filter((x, i) => {
    if (i <= c - 1) {
      return true;
    }
  });
}

Array.prototype.limit = limit;

function skip(c) {
  return this.filter((x, i) => {
    if (i > c - 1) {
      return true;
    }
  });
}

Array.prototype.skip = skip;

const arr = [
  { id: 1, name: "king" },
  { id: 2, name: "master" },
  { id: 3, name: "lisa" },
  { id: 4, name: "ion" },
  { id: 5, name: "jim" },
  { id: 6, name: "gowtham" },
  { id: 1, name: "jam" },
  { id: 1, name: "lol" },
  { id: 2, name: "kwick" },
  { id: 3, name: "april" },
  { id: 7, name: "sss" },
  { id: 8, name: "brace" },
  { id: 8, name: "peiter" },
  { id: 5, name: "hey" },
  { id: 6, name: "mkl" },
  { id: 9, name: "melast" },
  { id: 9, name: "imlast" },
  { id: 10, name: "glow" },
];

// skip

// console.log(arr.skip(2))

//limit

// console.log(arr.limit(2))

// skip + limit
console.log(arr.skip(2).limit(5));
