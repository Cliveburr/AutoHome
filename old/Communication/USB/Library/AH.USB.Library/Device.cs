using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UsbHidLibrary;

namespace AH.USB.Library
{
    public class Device : IDisposable
    {
        private const int _vendorId = 0x1781;
        private const int _productId = 0x07D0;
        private HidDevice _device;
        private UsbMonitor _monitor;

        public Device()
        {
            _monitor = new UsbMonitor();
            _monitor.UsbChangeEventArrival += new UsbMonitor.UsbChangeEventHandler(monitor_Arrival);
            _monitor.UsbChangeEventRemoved += new UsbMonitor.UsbChangeEventHandler(monitor_Removed);
        }

        private void monitor_Arrival()
        {
            IsConnected();
        }

        private void monitor_Removed()
        {
            if (_device != null)
            {
                var devices = HidDevice.Enumerate()
                    .Select(de => new HidDevice(de));

                var connected = devices
                    .Where(d => d.Attributes != null)
                    .FirstOrDefault(d => d.Attributes.VendorId == _vendorId && d.Attributes.ProductId == _productId);

                if (connected == null)
                {
                    _device.Dispose();
                    _device = null;
                }
            }
        }

        public bool IsConnected()
        {
            if (_device == null)
            {
                var devices = HidDevice.Enumerate()
                    .Select(de => new HidDevice(de));

                var connected = devices
                    .Where(d => d.Attributes != null)
                    .FirstOrDefault(d => d.Attributes.VendorId == _vendorId && d.Attributes.ProductId == _productId);

                if (connected != null)
                    _device = connected;
            }

            return _device != null;
        }

        public void Dispose()
        {
            if (_device != null)
                _device.Dispose();
        }

        public bool SendMessage(UInt16 ip, byte code, string body = null)
        {
            if (!IsConnected())
                return false;

            var hasBody = !string.IsNullOrEmpty(body);

            var msg = new byte[hasBody ? 5 + body.Length : 3];

            var ipbs = BitConverter.GetBytes(ip);
            msg[0] = ipbs[0];
            msg[1] = ipbs[1];

            if (hasBody)
                code |= 1 << 7;
            msg[2] = (byte)code;

            if (hasBody)
            {
                var lbodybs = BitConverter.GetBytes(body.Length);
                msg[3] = lbodybs[0];
                msg[4] = lbodybs[1];

                var bodybs = System.Text.Encoding.ASCII.GetBytes(body);

                Array.Copy(bodybs, 0, msg, 5, body.Length);
            }

            return _device.Write(msg) > 0;
        }
    }
}