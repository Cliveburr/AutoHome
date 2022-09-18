using AH.Interfaces.Api.Service;
using AH.Protocol.Library.Messages.CellingFan;
using Microsoft.AspNetCore.Mvc;

namespace AH.Interfaces.Api.Controllers.Module
{
    [Route("cellingfan")]
    public class CellingFanController : ApiControllerBase
    {
        private readonly ConnectionService _connectionService;

        public CellingFanController(ConnectionService connectionService)
        {
            _connectionService = connectionService;
        }

        [HttpPost("setlight")]
        public async Task<ActionResult> SetLight(BolleanRequest request)
        {
            using (var tcp = _connectionService.ConnectTCP(request.Model))
            {
                await tcp.Send(new StateSaveRequest
                {
                    SetLight = true,
                    Light = request.Value
                });
            }
            return Ok();
        }

        [HttpPost("setfan")]
        public async Task<ActionResult> SetFan(BolleanRequest request)
        {
            using (var tcp = _connectionService.ConnectTCP(request.Model))
            {
                await tcp.Send(new StateSaveRequest
                {
                    SetFan = true,
                    Fan = request.Value
                });
            }
            return Ok();
        }

        [HttpPost("setfanup")]
        public async Task<ActionResult> SetFanUp(BolleanRequest request)
        {
            using (var tcp = _connectionService.ConnectTCP(request.Model))
            {
                await tcp.Send(new StateSaveRequest
                {
                    SetFanUp = true,
                    FanUp = request.Value
                });
            }
            return Ok();
        }

        [HttpPost("setfanspeed")]
        public async Task<ActionResult> SetFanSpeed(UintRequest request)
        {
            using (var tcp = _connectionService.ConnectTCP(request.Model))
            {
                await tcp.Send(new StateSaveRequest
                {
                    FanSpeed = request.Value == 0 ?
                        FanSpeedEnum.Min :
                        request.Value == 1 ?
                        FanSpeedEnum.Medium :
                        FanSpeedEnum.Max
                });
            }
            return Ok();
        }
    }
}
