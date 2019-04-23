using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public class ConnectionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConnection _conn;

        public ConnectionMiddleware(RequestDelegate next, IConnection conn)
        {
            _next = next;
            _conn = conn;
        }

        public async Task Invoke(HttpContext context)
        {
            _conn.Check();
            await _next.Invoke(context);
        }
    }

    public static class ConnectionMiddlewareExtensions
    {
        public static IApplicationBuilder UseConnectionCheck(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ConnectionMiddleware>();
        }
    }
}