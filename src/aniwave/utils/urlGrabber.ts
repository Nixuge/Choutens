import { rc4Cypher } from "../../shared/utils/aniwave/rc4";
import { b64decode, b64encode } from "../../shared/utils/b64";


function serializeText(t: string) {
  return "".concat(b64encode(t)).replace(/\//g, "_").replace(/\+/g, "-");
}


// To be called on the id to get data.
function idToVrf(t: string) {
  t = encodeURIComponent(t);
  return (function (t) {
    /*
    var s = 8;
    t = serializeText(caesarRot13(caesarRot13(t)));
    var r = "";
    for (var o = 0; o < t.length; o++) {
      var h = t.charCodeAt(o);
      if (o % s == 7) {
        h += 6;
      } else if (o % s == 5) {
        h -= 3;
      } else if (o % s == 3) {
        h += 6;
      } else if (o % s == 2) {
        h -= 5;
      } else if (o % s == 6) {
        h += 3;
      } else if (o % s == 0) {
        h -= 2;
      } else if (o % s == 4) {
        h += 2;
      } else if (o % s == 1) {
        h -= 4;
      }
      r += String.fromCharCode(h);
    }
    return (r = serializeText((r = r.split("").reverse().join(""))));
    */
   return t
  })(serializeText(rc4Cypher("p01EDKu734HJP1Tm", t)));
}

function caesarRot13(t: string) {
  return t.replace(/[a-zA-Z]/g, function (t) {
    
    const res = String.fromCharCode(
      // @ts-ignore
      (t <= "Z" ? 90 : 122) >= (t = t.charCodeAt(0) + 13) ? t : t - 26,
    );
    return res;
  });
}

export function decodeVideoSkipData(encoded_url: string) {
  console.log(encoded_url);
  encoded_url = b64decode(
    "".concat(encoded_url).replace(/_/g, "/").replace(/-/g, "+"),
  );
  const decoded_url = decodeURIComponent(
    rc4Cypher("ctpAbOz5u7S6OMkx", encoded_url),
  );
  return decoded_url;
}
// clearer name
export function getVrf(input: string) {
  return encodeURIComponent(idToVrf(input));
}
