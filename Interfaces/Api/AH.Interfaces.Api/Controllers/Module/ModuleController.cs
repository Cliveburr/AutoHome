using AH.Interfaces.Api.Controllers.User;
using AH.Interfaces.Api.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AH.Interfaces.Api.Controllers.Module
{
    [Route("module")]
    public class ModuleController : ApiControllerBase
    {
        private readonly ConnectionService _connectionService;

        public ModuleController(ConnectionService connectionService)
        {
            _connectionService = connectionService;
        }

        [HttpGet("refreshdiscovery")]
        public ActionResult RefreshDiscovery()
        {
            _connectionService.RefreshModulesList();
            return Ok();
        }

        [HttpPost("modules")]
        public ActionResult<List<ModuleModel>> GetModuleList(ModuleListRequest request)
        {
            return Ok(_connectionService.Modules
                .Where(m => m.OnTime > request.FromTime)
                .Select(m => new ModuleModel
                {
                    UID = m.UID,
                    Alias = m.Alias,
                    ModuleType = m.ModuleType.ToString(),
                    Ip = m.IpString
                })
                .ToList());
        }


        [HttpGet("getmodule/{uid}")]
        public async Task<ActionResult<ModuleModel?>> GetModule(byte uid)
        {
            var retMod = _connectionService.Modules
                .FirstOrDefault(m => m.UID == uid);
            if (retMod == null)
            {
                retMod = await _connectionService
                    .RefreshModulesAndWaitFor(uid);
            }

            if (retMod == null)
            {
                return Ok(null);
            }
            else
            {
                return Ok(new ModuleModel
                {
                    UID = retMod.UID,
                    Alias = retMod.Alias,
                    Ip = retMod.IpString,
                    ModuleType = retMod.ModuleType.ToString()
                });
            }
        }
    }
}
