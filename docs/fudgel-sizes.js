import { component, request } from './fudgel.min.js';

component(
    'fudgel-sizes',
    {
        style: /* css */ `
            .flexCenter {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `,
        template: /* html */ `
            <div class="flexCenter">
                <table>
                    <tr><th></th><th>Minified</th><th>Gzipped</th></tr>
                    <tr *for="row of this.data">
                        <th>{{$scope.row?.name}}</th>
                        <td>{{$scope.row?.minified}}</td>
                        <td>{{$scope.row?.gzipped}}</td>
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
