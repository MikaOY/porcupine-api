Porcupine API
=====================

Express API app for the [Porcupine](https://github.com/MikaOY/porcupine-ionic) app.

Contributors:
--------
Coded with <3 by [@MikaOY](https://github.com/MikaOY) and [@omnikitty](https://github.com/omnikitty).

UPDATES:
--------
*2017-07-01: Cleanup*

A code base created by two programmers who, at the the time of writing, have one month of experience writing JS, is not very pretty or organized. We pruned out our git tree and filled out the crucial repository files.

*2017-07-05: Cleanup of the Cleanup*

We attempted to get some testing set up during the cleanup, but soon we discovered it's quite janky with Express and two developers writing an app on 3 platforms AND an API. So we ditched it. For now.
Also, Babel 6, at the time of writing, is a pain in the neck to run on our deployment server. So that's gone too.

Get<sup>1</sup> started
-------------------------------
Clone the repository, and...
```
npm install
```

<sup>1</sup> Because this is a RESTful API that can GET data...get it?

Debugging commands
----------------------
`npm start` local serve at localhost:3000
