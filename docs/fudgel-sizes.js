import { component, css, html } from './fudgel.min.js';

component(
    'fudgel-sizes',
    {
        style: css`
            .flexCenter {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .topHeader {
                border-bottom: 1px solid black;
            }

            td {
                text-align: center;
            }
        `,
        template: html`
            <div class="flexCenter">
                <table>
                    <tr>
                        <th class="topHeader"></th>
                        <th class="topHeader">Minified</th>
                        <th class="topHeader">Gzipped</th>
                    </tr>
                    <tr *for="row of data">
                        <th>{{row.name}}</th>
                        <td>{{row.minified.toLocaleString()}}</td>
                        <td>{{row.gzipped.toLocaleString()}}</td>
                    </tr>
                </table>
            </div>
        `,
    },
    class {
        data = [];

        onInit() {
            fetch('fudgel-sizes.json')
                .then(response => response.json())
                .then(data => {
                    this.data = data;
                });
        }
    }
);
