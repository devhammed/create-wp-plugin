#!/usr/bin/env node

const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const stringCase = require('stringcase')
const chalk = require('chalk')
const isSemver = require('is-semver')
const figlet = require('figlet')
const exec = require('child_process').exec

const README_TEMPLATE = `# %PLUGIN_NAME%

## Description

%PLUGIN_DESCRIPTION%

## Usage



## Changelog

### %PLUGIN_VERSION%

* Initial commit.

## Contributors

* %PLUGIN_AUTHOR% (%AUTHOR_EMAIL%)

## License

Licensed under [GPL v2](http://www.opensource.org/licenses/gpl-license.php).
`
const STARTER_FILE_TEMPLATE = `<?php
/**
 * Plugin Name: %PLUGIN_NAME%
 * Plugin URI: %PLUGIN_URI%
 * Description: %PLUGIN_DESCRIPTION%
 * Version: %PLUGIN_VERSION%
 * Author: %PLUGIN_AUTHOR%
 * Author URI: %AUTHOR_URI%
 * Text Domain: %TEXT_DOMAIN%
 *
 * License: GPL-2.0+
 * License URI: http://www.opensource.org/licenses/gpl-license.php
 */

/*
  Copyright %YEAR%  %PLUGIN_AUTHOR% (%AUTHOR_EMAIL%)

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as
  published by the Free Software Foundation.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
  to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or
  substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

namespace %AUTHOR_NAMESPACE%%PLUGIN_NAMESPACE%;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
  exit;
}

if ( ! class_exists( '%PLUGIN_NAMESPACE%' ) ) :

class %PLUGIN_NAMESPACE% {

  private static $instance;

  public static function instance() {

    if ( ! isset( self::$instance ) && ! ( self::$instance instanceof %PLUGIN_NAMESPACE% ) ) {

      self::$instance = new %PLUGIN_NAMESPACE%;

      self::$instance->constants();
      self::$instance->includes();
      self::$instance->hooks();
    }

    return self::$instance;
  }

  /**
   * Constants
   */
  public function constants() {

    // Plugin version
    if ( ! defined( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_VERSION' ) ) {
      define( '%PLUGIN_CONSTANT_PREFIX%_VERSION', '0.1.0' );
    }

    // Plugin file
    if ( ! defined( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE' ) ) {
      define( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE', __FILE__ );
    }

    // Plugin basename
    if ( ! defined( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_BASENAME' ) ) {
      define( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_BASENAME', plugin_basename( %PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE ) );
    }

    // Plugin directory path
    if ( ! defined( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_DIR_PATH' ) ) {
      define( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_DIR_PATH', trailingslashit( plugin_dir_path( %PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE )  ) );
    }

    // Plugin directory URL
    if ( ! defined( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_DIR_URL' ) ) {
      define( '%PLUGIN_CONSTANT_PREFIX%_PLUGIN_DIR_URL', trailingslashit( plugin_dir_url( %PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE )  ) );
    }
  }

  /**
   * Action/filter hooks
   */
  public function hooks() {
    register_activation_hook( %PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE, array( $this, 'activate' ) );
    register_deactivation_hook( %PLUGIN_CONSTANT_PREFIX%_PLUGIN_FILE, array( $this, 'deactivate' ) );
    add_action('init', array( $this, 'enqueue' ));
  }

  /**
   * Enqueue scripts and styles
  */
  public function enqueue() {}

  /**
   * Include/Require PHP files
   */
  public function includes() {}

  /**
   * Run on plugin activation
   */
  public function activate() {}

  /**
   * Run on plugin de-activation
   */
  public function deactivate() {}
}

endif;

%PLUGIN_NAMESPACE%::instance();
`

const required = msg => input =>
  input.replace(/[\s-]/, '').length ? true : msg

const canBeEmpty = input => (input === 'empty' ? '' : input.trim())

const renderTemplate = (str, data) => {
  const replaceKeys = {
    '%PLUGIN_NAME%': 'name',
    '%PLUGIN_DESCRIPTION%': 'description',
    '%PLUGIN_AUTHOR%': 'authorName',
    '%PLUGIN_URI%': 'url',
    '%PLUGIN_VERSION%': 'version',
    '%PLUGIN_NAMESPACE%': 'namespace',
    '%PLUGIN_CONSTANT_PREFIX%': 'constants',
    '%AUTHOR_EMAIL%': 'authorEmail',
    '%AUTHOR_URI%': 'authorURL',
    '%TEXT_DOMAIN%': 'textDomain'
  }

  Object.keys(replaceKeys).map(key => {
    str = str.replace(RegExp(key, 'g'), data[replaceKeys[key]] || '')
  })

  str = str.replace(
    /%AUTHOR_NAMESPACE%/,
    data.authorNamespace && data.authorNamespace.length
      ? `${data.authorNamespace}\\`
      : ''
  )
  str = str.replace(/%YEAR%/g, new Date().getFullYear())

  return str
}

console.clear()
console.log(
  chalk.green(
    figlet.textSync('wp-plugin', {
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
)
console.log('\nBy Hammed Oyedele')
console.log('GitHub: https://github.com/devhammed/wp-plugin\n')
console.log('---\n')

inquirer
  .prompt([
    {
      type: 'input',
      name: 'key',
      message: "Plugin Slug (lowercase with dashes; e.g. 'my-plugin'):",
      filter: input => stringCase.spinalcase(input),
      validate: required('You must specify a plugin key.')
    },
    {
      type: 'input',
      name: 'name',
      message: 'Plugin Name:',
      default: answers => stringCase.titlecase(answers.key)
    },
    {
      type: 'input',
      name: 'namespace',
      message: 'Plugin Namespace:',
      default: answers => stringCase.pascalcase(answers.key)
    },
    {
      type: 'input',
      name: 'constants',
      message: 'Plugin Constants Prefix:',
      default: answers => stringCase.constcase(answers.key)
    },
    {
      type: 'input',
      name: 'description',
      default: 'empty',
      filter: canBeEmpty,
      message: 'Plugin Description:'
    },
    {
      type: 'input',
      name: 'url',
      default: '#',
      message: 'Plugin URI:'
    },
    {
      type: 'input',
      name: 'version',
      default: '0.0.1',
      message: 'Plugin Version:',
      filter: canBeEmpty,
      validate: function (input) {
        if (isSemver(input)) {
          return true
        } else {
          console.log(
            chalk.red(' Error: must be valid semver number (e.g. 0.0.1)')
          )
          return false
        }
      }
    },
    {
      type: 'input',
      name: 'textDomain',
      message: "Plugin's Text Domain:",
      default: 'wordpress',
      filter: canBeEmpty
    },
    {
      type: 'input',
      name: 'authorName',
      default: 'empty',
      filter: canBeEmpty,
      message: 'Author Name:'
    },
    {
      type: 'input',
      name: 'authorEmail',
      default: 'empty',
      filter: canBeEmpty,
      message: "Author's Email Address:"
    },
    {
      type: 'input',
      name: 'authorNamespace',
      default: 'empty',
      filter: canBeEmpty,
      message: "Author's Vendor Namespace:"
    }
  ])
  .then(answers => {
    const starterFile = renderTemplate(STARTER_FILE_TEMPLATE, answers)
    const readmeFile = renderTemplate(README_TEMPLATE, answers)
    const pluginDirectory = answers.key

    console.log(chalk.green('\nCreating plugin...'))

    try {
      if (!fs.existsSync(pluginDirectory)) {
        fs.mkdirSync(pluginDirectory)
      }
    } catch (_) {
      console.log(chalk.red('\nFailed to create plugin folder.'))
      process.exit(1)
    }

    try {
      fs.writeFileSync(path.join(pluginDirectory, 'README.md'), readmeFile)
      fs.writeFileSync(
        path.join(pluginDirectory, `${answers.key}.php`),
        starterFile
      )
    } catch (_) {
      console.log(chalk.red('\nError occurred while creating plugin files.'))
      process.exit(1)
    }

    exec(`git init ${pluginDirectory}`, (err, stdout, stderr) => {
      if (err) {
        console.log(
          chalk.red('\nGit not found, skipping repository initialization.')
        )
      } else {
        console.log(
          chalk.green(
            `\nInitialized an empty Git repository in ${pluginDirectory}!`
          )
        )
      }
      console.log(chalk.green('\nYour plugin is ready,'))
      console.log(
        chalk.green('Change into the directory to start editing files!')
      )
      console.log(chalk.green('\nHappy coding!'))
    })
  })
