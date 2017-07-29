using System;
using System.Collections.Generic;
using NaFile = NativeNET.Kernel32.File;
using NaDevice = NativeNET.SetupApi.Device;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32.SafeHandles;
using System.IO;

namespace UsbHidLibrary
{
    public class HidDevice : IDisposable
    {
        private static Guid _hidClassGuid = Guid.Empty;

        public string Path { get; private set; }
        public string Description { get; private set; }
        public IntPtr Handle { get; private set; }
        public HidDeviceAttributes Attributes { get; private set; }
        public HidDeviceCapabilities Capabilities { get; private set; }
        public byte ReportID { get; set; }
        public DeviceMode DeviceMode { get; private set; }
        public int Timeout { get; set; }

        public HidDevice(HidDeviceInfo info, DeviceMode devideMode)
        {
            Path = info.Path;
            Description = info.Description;
            ReportID = 10;
            DeviceMode = devideMode;
            Timeout = 30;

            try
            {
                OpenDeviceIO();
                GetDeviceAttributes();
                GetDeviceCapabilities();
            }
            catch
            {
                Dispose();
                throw;
            }
        }

        public HidDevice(HidDeviceInfo info)
            : this(info, DeviceMode.NonOverlapped)
        {
        }

        private void OpenDeviceIO()
        {
            NaFile.FlagsAndAttributes flags = DeviceMode == DeviceMode.Overlapped ?
                NaFile.FlagsAndAttributes.FILE_FLAG_OVERLAPPED :
                0;

            Handle = NaFile.CreateFile.Run(
                Path,
                NaFile.DesiredAccessFlags.GENERIC_WRITE | NaFile.DesiredAccessFlags.GENERIC_READ,
                NaFile.ShareModeFlags.FILE_SHARE_WRITE | NaFile.ShareModeFlags.FILE_SHARE_READ,
                NaFile.CreationDispositionEnum.OPEN_EXISTING,
                flags,
                IntPtr.Zero);
        }

        public void Dispose()
        {
            if (Handle != null)
            {
                if (Environment.OSVersion.Version.Major > 5)
                {
                    NaFile.CancelIoEx.Run(Handle, IntPtr.Zero);
                }
                NativeNET.Kernel32.Handle.CloseHandle.Run(Handle);
            }
        }

        private void GetDeviceAttributes()
        {
            var attr = NativeNET.Hid.GetAttributes.Get(Handle);
            if (attr.HasValue)
                Attributes = new HidDeviceAttributes(attr.Value);
        }

        private void GetDeviceCapabilities()
        {
            var capabilities = NativeNET.Hid.GetCapabilities.Get(Handle);
            if (capabilities.HasValue)
                Capabilities = new HidDeviceCapabilities(capabilities.Value);
        }

        public static IEnumerable<HidDeviceInfo> Enumerate()
        {
            var devices = new List<HidDeviceInfo>();
            var hidClass = NativeNET.Hid.GetHidGuid.Run();
            var deviceInfoSet = NaDevice.GetClassDevs.GetDeviceInterfacePresentAndEnabled(hidClass, null, IntPtr.Zero);

            if (deviceInfoSet.ToInt64() != -1)
            {
                try
                {
                    NaDevice.EnumDeviceInfo.ForEach(deviceInfoSet, hidClass, (deviceInfoData, deviceInterfaceData) =>
                    {
                        var devicePath = GetDevicePath(deviceInfoSet, deviceInterfaceData);
                        var description = GetDescription(deviceInfoSet, deviceInfoData);

                        devices.Add(new HidDeviceInfo
                        {
                            Path = devicePath,
                            Description = description
                        });
                    });
                }
                finally
                {
                    NaDevice.GetClassDevs.Destroy(deviceInfoSet);
                }
            }
            return devices;
        }

        private static string GetDevicePath(IntPtr deviceInfoSet, NaDevice.DeviceInterfaceData deviceInterfaceData)
        {
            var detail = NaDevice.GetDeviceInterfaceDetail.Run(deviceInfoSet, deviceInterfaceData);
            if (!detail.HasValue)
                throw new Exception("Error getting the device interface detail!");

            return detail.Value.DevicePath;
        }

        private static string GetDescription(IntPtr deviceInfoSet, NaDevice.DeviceInfoData devinfoData)
        {
            return NaDevice.GetDeviceProperty.Description(deviceInfoSet, devinfoData) ??
                NaDevice.GetDeviceRegistryProperty.Description(deviceInfoSet, devinfoData);
        }

        public uint Write(byte[] data)
        {
            var output = Capabilities.OutputReportByteLength;

            if (output <= 0)
                return 0;

            var index = 0;
            uint sum = 0;
            var length = data.Length;

            while (index < length)
            {
                var pl = length - index;
                if (pl > output - 1)
                    pl = output - 1;

                var buffer = new byte[output];
                buffer[0] = ReportID;
                Array.Copy(data, index, buffer, 1, pl);

                index += pl;

                sum += WriteData(buffer);
            }

            return sum;
        }

        private uint WriteData(byte[] buffer)
        {
            uint bytesWritten = 0;

            var overlapped = new NativeOverlapped();
            if (!NaFile.IO.Write(Handle, buffer, (uint)buffer.Length, out bytesWritten, ref overlapped))
                throw new Exception("WriteFile fail! Code: " + System.Runtime.InteropServices.Marshal.GetLastWin32Error().ToString());
            else
                return bytesWritten;
        }

        public async Task<Response.ReadResponse> Read()
        {
            var input = Capabilities.InputReportByteLength;

            return await Task.Run(() =>
            {
                var tr = new Response.ReadResponse();

                try
                {
                    if (input <= 0)
                        throw new Exception("Device capabilities has now report length!");

                    var buffer = new byte[input];
                    uint bytesRead = 0;

                    var overlapped = new NativeOverlapped();
                    if (!NaFile.IO.Read(Handle, buffer, (uint)buffer.Length, out bytesRead, ref overlapped))
                        throw new Exception("Read fail! Code: " + System.Runtime.InteropServices.Marshal.GetLastWin32Error().ToString());

                    tr.Data = new byte[bytesRead - 1];
                    Array.Copy(buffer, 1, tr.Data, 0, bytesRead - 1);

                    tr.Success = true;
                }
                catch (Exception err)
                {
                    tr.Success = false;
                    tr.Error = err;
                }

                return tr;
            });
        }
    }
}