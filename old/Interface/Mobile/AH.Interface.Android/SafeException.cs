using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;

namespace AH.Interface.Android
{
    public class SafeException : Exception
    {
        public SafeException(string message, params string[] format)
            : base(string.Format(message, format))
        {
        }

        public override string ToString()
        {
            return base.Message;
        }
    }
}