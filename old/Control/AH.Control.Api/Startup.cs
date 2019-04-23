using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AH.Control.Api.Entities;
using AH.Control.Api.Database;
using AH.Control.Api.Business;
using AH.Control.Api.Protocol;
using Microsoft.AspNetCore.Cors.Infrastructure;

namespace AH.Control.Api
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddMvc();

            services.Configure<ConnectionOptions>(Configuration.GetSection("AutoHomeConnection"));
            services.AddSingleton<IConnection, Connection>();
            services.AddSingleton<AutoHomeDatabase>();

            services.AddScoped<ModuleComponent>();
            services.AddScoped<StandardComponent>();
            services.AddScoped<AreaComponent>();
            services.AddScoped<ModuleVersionComponent>();

            services.Configure<AutoHomeOptions>(Configuration.GetSection("AutoHomeProtocol"));
            services.AddSingleton<AutoHomeProtocol>();

            var corsBuilder = new CorsPolicyBuilder();
            corsBuilder.AllowAnyHeader();
            corsBuilder.AllowAnyMethod();
            corsBuilder.AllowAnyOrigin();
            corsBuilder.AllowCredentials();

            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", corsBuilder.Build());
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory,
            AutoHomeDatabase autoHomeDb, AutoHomeProtocol protocol)
        {
            app.UseCors("AllowAll");

            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            app.UseConnectionCheck();

            app.UseMvc();
        }
    }
}
