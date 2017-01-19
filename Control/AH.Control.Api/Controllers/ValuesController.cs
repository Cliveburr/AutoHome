using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RethinkDb.Driver;

namespace AH.Control.Api.Controllers
{
    [Route("api/[controller]")]
    public class ValuesController : Controller
    {
        public static RethinkDB R = RethinkDB.R;

        // GET api/values
        [HttpGet]
        public object Get()
        {
            var conn = R.Connection()
             .Hostname("127.0.0.1")
             .Port(28015)
             .Timeout(60)
             .Connect();

            var obj = new { Bar = 1, Baz = 2 };
            var result = R.Db("test").Table("mytable").Insert(obj).Run(conn);

            object foo = R.Db("test").Table("mytable").Get("abc").Run<object>(conn);
            //foo.Dump();

            return foo;
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/values
        [HttpPost]
        public void Post([FromBody]string value)
        {
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
