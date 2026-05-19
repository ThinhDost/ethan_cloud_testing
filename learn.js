const array = [1, 2, 3, 4, 5];

function larger(target, value)
{
   return (value > target);
}

Array.prototype.filter2 = function(callback)
{
   let result = [];
   let array_length = this.length;

   for(let i = 0; i < array_length; ++i)
   {
      if(callback(this[i]))
      {
         result.push(this[i]);
      }
   }
   return result;
}

let filtered = array.filter2(value => {
   return value > 2;
});
console.log(filtered);


