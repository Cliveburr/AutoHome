using System;

namespace UsbHidLibrary.Response
{
    public class ReadResponse
    {
        public bool Success { get; set; }

        public byte[] Data { get; set; }

        public Exception Error { get; set; }
    }
}