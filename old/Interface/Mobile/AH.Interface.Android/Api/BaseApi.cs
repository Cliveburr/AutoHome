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
using System.Net;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.IO;

namespace AH.Interface.Android.Api
{
    public abstract class BaseApi
    {
        protected static Dictionary<string, string> _requestHeaders;

        static BaseApi()
        {
            _requestHeaders = new Dictionary<string, string>();
        }

        public static Dictionary<string, string> Headers
        {
            get
            {
                return _requestHeaders;
            }
        }

        public static void AddAuthenticationHeaders(int sessionId, string sessionToken)
        {
            if (_requestHeaders.ContainsKey("SessionId"))
            {
                _requestHeaders["SessionId"] = sessionId.ToString();
            }
            else
            {
                _requestHeaders.Add("SessionId", sessionId.ToString());
            }

            if (_requestHeaders.ContainsKey("SessionToken"))
            {
                _requestHeaders["SessionToken"] = sessionToken;
            }
            else
            {
                _requestHeaders.Add("SessionToken", sessionToken);
            }
        }

        public static void RemoveAuthenticationHeaders()
        {
            if (_requestHeaders.ContainsKey("SessionId"))
            {
                _requestHeaders.Remove("SessionId");
            }

            if (_requestHeaders.ContainsKey("SessionToken"))
            {
                _requestHeaders.Remove("SessionToken");
            }
        }
    }

    public abstract class BaseApi<T> : BaseApi where T : class, new()
    {
        public static T Instance { get; set; }
        private JsonSerializerSettings _jsonSett;

        protected abstract string GetApiName();

        static BaseApi()
        {
            Instance = new T();
        }


        public BaseApi()
        {
            _jsonSett = new JsonSerializerSettings
            {
                //ContractResolver = new CamelCasePropertyNamesContractResolver()
            };
        }

        protected TResponse Get<TResponse>(string methodName = "")
        {
            var req = CreateRequest(methodName, "GET");
            var resp = GetResponseString(req);
            return DeserializeJSON<TResponse>(resp);
        }

        protected TResponse Post<TRequest, TResponse>(string methodName, TRequest body)
        {
            var req = CreateRequest(methodName, "POST");
            WriteBody(body, req);
            var resp = GetResponseString(req);
            return DeserializeJSON<TResponse>(resp);
        }

        private void WriteBody<TRequest>(TRequest body, HttpWebRequest req)
        {
            var json = SerializeJSON(body);
            var data = Encoding.UTF8.GetBytes(json);
            req.ContentLength = data.Length;


            using (var st = req.GetRequestStream())
            {
                st.Write(data, 0, data.Length);
                st.Flush();
                st.Close();
            }
        }

        private TResponse DeserializeJSON<TResponse>(string text)
        {
            return JsonConvert.DeserializeObject<TResponse>(text, _jsonSett);
        }

        private string SerializeJSON<TRequest>(TRequest obj)
        {
            return JsonConvert.SerializeObject(obj, Formatting.None, _jsonSett);
        }

        private string GetResponseString(WebRequest req)
        {
            var rep = req.GetResponse();
            using (var st = rep.GetResponseStream())
            using (var sr = new StreamReader(st))
            {
                return sr.ReadToEnd();
            }
        }

        private HttpWebRequest CreateRequest(string methodName, string httpMethod)
        {
            var request = WebRequest.Create(GetFullUri(methodName)) as HttpWebRequest;
            request.KeepAlive = false;
            request.Method = httpMethod;
            request.Accept = "application/json";
            request.ContentType = "application/json";

            foreach (var h in _requestHeaders)
            {
                request.Headers.Add(h.Key, h.Value);
            }

            //request.Proxy = GlobalProxySelection.GetEmptyWebProxy();

            return request;
        }

        private string GetFullUri(string methodName)
        {
            return string.Format(@"http://{0}/api/{1}/{2}", App.ApiAddress.ToString(), GetApiName(), methodName);
        }
    }
}