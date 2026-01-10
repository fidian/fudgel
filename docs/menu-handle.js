import { component, css, html, metadata } from './fudgel.min.js';

component(
    'menu-handle',
    {
        style: css`
            .wrapper {
                align-items: center;
                box-sizing: border-box;
                display: flex;
                height: 60px;
                justify-content: center;
                padding: 8px;
                position: relative;
                width: 60px;
                user-select: none;
            }

            .icon {
                position: absolute;
                transition: opacity 0.5s ease-in-out;
                font-size: 2em;
            }

            .hide {
                opacity: 0;
            }
        `,
        template: html`
            <div @click.stop="click()" class="wrapper">
                <span class="icon">☰</span>
                <span class="icon hide">✕</span>
            </div>
        `,
    },
    class {
        click() {
            document.querySelector('.menu').classList.toggle('open');
            this[metadata].root.querySelectorAll('.icon').forEach(element => {
                element.classList.toggle('hide');
            });
        }
    }
);
