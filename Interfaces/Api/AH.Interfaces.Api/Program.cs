using AH.Interfaces.Api.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers();

var key = Encoding.ASCII.GetBytes(builder.Configuration.GetSection("SecurityKey").Value);
builder.Services
    .AddHttpContextAccessor()
    .AddAuthorization()
    .AddAuthentication(conf =>
    {
        conf.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        conf.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        conf.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(conf =>
    {
        conf.RequireHttpsMetadata = false;
        conf.SaveToken = true;
        conf.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            RequireExpirationTime = true
        };
    });

builder.Services
    .AddCors(options =>
    {
        options.AddDefaultPolicy(
            policyBuilder =>
            {
                var allowOrigins = builder.Configuration.GetSection("AllowOrigins").Value;

                policyBuilder
                    .WithOrigins(allowOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
    });

builder.Services
    .AddSingleton<ConnectionService>();

var app = builder.Build();

if (builder.Configuration.GetValue("Https", false))
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
