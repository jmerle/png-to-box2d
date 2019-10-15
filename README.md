PNG to Box2D
============

A CLI to convert PNG images to Box2D shape data. Based on [anko/image-to-box2d-body](https://github.com/anko/image-to-box2d-body).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Build Status](https://dev.azure.com/jmerle/png-to-box2d/_apis/build/status/Build?branchName=master)](https://dev.azure.com/jmerle/png-to-box2d/_build/latest?definitionId=8&branchName=master)
[![Version](https://img.shields.io/npm/v/png-to-box2d.svg)](https://npmjs.org/package/png-to-box2d)
[![License](https://img.shields.io/npm/l/png-to-box2d.svg)](https://github.com/jmerle/png-to-box2d/blob/master/package.json)

# Install

```sh-session
$ npm install --global png-to-box2d
$ # or
$ yarn global add png-to-box2d
```

The following software must be available on your `PATH`:
* [ImageMagick's](https://imagemagick.org/) `convert` & `mogrify`
* [`potrace`](http://potrace.sourceforge.net/)
* [`inkscape`](https://inkscape.org/)

# Commands

<!-- commands -->
* [`png-to-box2d generate INPUT [OUTPUT]`](#png-to-box2d-generate-input-output)
* [`png-to-box2d help [COMMAND]`](#png-to-box2d-help-command)
* [`png-to-box2d image INPUT OUTPUT`](#png-to-box2d-image-input-output)

## `png-to-box2d generate INPUT [OUTPUT]`

convert a PNG image to Box2D shape data

```
USAGE
  $ png-to-box2d generate INPUT [OUTPUT]

ARGUMENTS
  INPUT   path to PNG image to generate Box2D shape data for
  OUTPUT  [default: {INPUT}.json] where the generated JSON file should be placed

OPTIONS
  -h, --help       show CLI help
  -o, --overwrite  overwrite the output file if it exists

EXAMPLES
  $ png-to-box2d generate castle.png
  To do

  $ png-to-box2d generate castle.png castle-shape.json
  To do
```

_See code: [src/commands/generate.ts](https://github.com/jmerle/png-to-box2d/blob/v1.0.0/src/commands/generate.ts)_

## `png-to-box2d help [COMMAND]`

display help for png-to-box2d

```
USAGE
  $ png-to-box2d help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `png-to-box2d image INPUT OUTPUT`

convert generated Box2D shape data to an image for debugging

```
USAGE
  $ png-to-box2d image INPUT OUTPUT

ARGUMENTS
  INPUT   path to JSON file containing shape data generated by the `generate` command
  OUTPUT  where the generated PNG image should be placed

OPTIONS
  -h, --help       show CLI help
  -o, --overwrite  overwrite the output file if it exists

EXAMPLE
  $ png-to-box2d image castle.png.json 
  To do
```

_See code: [src/commands/image.ts](https://github.com/jmerle/png-to-box2d/blob/v1.0.0/src/commands/image.ts)_
<!-- commandsstop -->
