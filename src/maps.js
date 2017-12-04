// Description:
//   Interacts with the Google Maps API.
//
// Commands:
//   hubot map me <query> - Returns a map view of the area returned by `query`.

module.exports = function(robot) {

  robot.respond(/((driving|walking|bike|biking|bicycling) )?directions from (.+) to (.+)/i, function(msg) {
    let mode        = msg.match[2] || 'driving';
    const origin      = msg.match[3];
    const destination = msg.match[4];
    const key         = process.env.HUBOT_GOOGLE_API_KEY;

    if (origin === destination) {
      return msg.send("Now you're just being silly.");
    }

    if (!key) {
      msg.send("Please enter your Google API key in the environment variable HUBOT_GOOGLE_API_KEY.");
    }
    if ((mode === 'bike') || (mode === 'biking')) {
      mode = 'bicycling';
    }

    const url         = "https://maps.googleapis.com/maps/api/directions/json";
    const query       = {
      mode,
      key,
      origin,
      destination,
      sensor:      false
    };

    return robot.http(url).query(query).get()(function(err, res, body) {
      const jsonBody = JSON.parse(body);
      const route = jsonBody.routes[0];
      if (!route) {
        msg.send("Error: No route found.");
        return;
      }
      const legs = route.legs[0];
      const start = legs.start_address;
      const end = legs.end_address;
      const distance = legs.distance.text;
      const duration = legs.duration.text;
      let response = `Directions from ${start} to ${end}\n`;
      response += `${distance} - ${duration}\n\n`;
      let i = 1;
      for (let step of Array.from(legs.steps)) {
        let instructions = step.html_instructions.replace(/<div[^>]+>/g, ' - ');
        instructions = instructions.replace(/<[^>]+>/g, '');
        response += `${i}. ${instructions} (${step.distance.text})\n`;
        i++;
      }

      msg.send("http://maps.googleapis.com/maps/api/staticmap?size=400x400&" +
               `path=weight:3%7Ccolor:red%7Cenc:${route.overview_polyline.points}&sensor=false`
      );
      return msg.send(response);
    });
  });

  return robot.respond(/(?:(satellite|terrain|hybrid)[- ])?map( me)? (.+)/i, function(msg) {
    const mapType  = msg.match[1] || "roadmap";
    const location = encodeURIComponent(msg.match[3]);
    const mapUrl   = "http://maps.google.com/maps/api/staticmap?markers=" +
                location +
                "&size=400x400&maptype=" +
                mapType +
                "&sensor=false" +
                "&format=png"; // So campfire knows it's an image
    const url      = "http://maps.google.com/maps?q=" +
               location +
              "&hl=en&sll=37.0625,-95.677068&sspn=73.579623,100.371094&vpsrc=0&hnear=" +
              location +
              "&t=m&z=11";

    msg.send(mapUrl);
    return msg.send(url);
  });
};
