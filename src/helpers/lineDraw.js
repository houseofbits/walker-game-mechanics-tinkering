

export function drawConnection(context, start, end) {
    context.beginPath();

    const dx = Math.abs(end.x - start.x);

    // control points
    const cp1x = start.x + dx * 0.5;
    const cp1y = start.y;

    const cp2x = end.x - dx * 0.5;
    const cp2y = end.y;

    context.moveTo(start.x, start.y);

    context.bezierCurveTo(
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        end.x,
        end.y
    );

    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.stroke();
}

export function drawConnectedLines(ctx, inputs, outputs)
{   
    if (!ctx) {
        return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let inputId = 0;
    for (const input of inputs) {
        const sx = input.outputX;
        const sy = input.outputY;

        if (outputs[inputId] === undefined) {
            return;
        }

        const element = outputs[inputId];
        const rect = element.getBoundingClientRect();

        const ex = (rect.left + rect.width / 2);
        const ey = rect.top + rect.height / 2;


        if (ctx) {
            drawConnection(ctx, {
                x: sx,
                y: sy,
            }, {
                x: ex,
                y: ey,
            });
        }

        inputId++;
    }
}