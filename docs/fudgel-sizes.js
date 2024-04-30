// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
import('./fudgel.min.js').then(({ component, css, html }) => {
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
            constructor() {
                this.data = [];
            }

            onInit() {
                fetch('fudgel-sizes.json')
                    .then(response => response.json())
                    .then(data => {
                        this.data = data;
                    });
            }
        }
    );
});
