PNG to Box2D
============

A CLI to convert PNG images to Box2D shape data. Based on [anko/image-to-box2d-body](https://github.com/anko/image-to-box2d-body).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/png-to-box2d.svg)](https://npmjs.org/package/png-to-box2d)
[![License](https://img.shields.io/npm/l/png-to-box2d.svg)](https://github.com/jmerle/png-to-box2d/blob/master/package.json)

# Install

```sh-session
$ npm install --global png-to-box2d
$ # or
$ yarn global add png-to-box2d
```

The following software should be available on your `PATH`:
* [ImageMagick's](https://imagemagick.org/) `convert` & `mogrify`
* [`potrace`](http://potrace.sourceforge.net/)
* [`inkscape`](https://inkscape.org/)

# Commands

<!-- commands -->
* [`png-to-box2d generate [FILE]`](#png-to-box2d-generate-file)
* [`png-to-box2d help [COMMAND]`](#png-to-box2d-help-command)
* [`png-to-box2d image [FILE]`](#png-to-box2d-image-file)

## `png-to-box2d generate [FILE]`

convert one or more PNG images to Box2D shape data

```
USAGE
  $ png-to-box2d generate [FILE]

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ png-to-box2d generate
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

## `png-to-box2d image [FILE]`

convert generated Box2D shape data to an image for debugging

```
USAGE
  $ png-to-box2d image [FILE]

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ png-to-box2d image
  To do
```

_See code: [src/commands/image.ts](https://github.com/jmerle/png-to-box2d/blob/v1.0.0/src/commands/image.ts)_
<!-- commandsstop -->
