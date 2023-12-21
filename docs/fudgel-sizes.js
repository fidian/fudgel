import { component, css, html, request } from './fudgel.min.js';

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
                    <tr *for="row of this.data">
                        <th>{{$scope.row.name}}</th>
                        <td>{{$scope.row.minified.toLocaleString()}}</td>
                        <td>{{$scope.row.gzipped.toLocaleString()}}</td>
                    </tr>
                </table>
            </div>
        `,
    },
    class {
        data = [];

        onInit() {
            request({ url: 'fudgel-sizes.json' }).then(result => {
                this.data = result;
            });
        }
    }
);
