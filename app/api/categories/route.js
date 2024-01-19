import {NextResponse} from "next/server";
import prisma from "../../../utils/connect";

export const GET = async () => {
    try {

        const categories = await prisma.category.findMany()

        return new NextResponse(
            JSON.stringify(categories, {status: 200})
        )

    } catch (err){
        console.log(err)
        return new NextResponse(
            JSON.stringify({message: 'Something went wrong!'}, {status: 500})
        )
    }
}

export const PUT = async (req) => {

    try {

        const body = await req.json()
        const { data } = body
        const categoryId = data.id;

        console.log(data)

        const { id, ...updateData } = data;

        const updatedCategory = await prisma.category.update({
            where: {
                id: categoryId
            },
            data: updateData
        });

        return new NextResponse(
            JSON.stringify(updatedCategory, { status: 200 })
        );

    } catch (err){
        console.log(err)
        return new NextResponse(
            JSON.stringify({message: 'Something went wrong!'}, {status: 500})
        )
    }
}

export const POST = async (req) => {

    try {

        const body = await req.json()

        const category = await prisma.category.create({
            data: body
        })

        return new NextResponse(
            JSON.stringify(category, {status: 200})
        )

    } catch (err){
        console.log(err)
        return new NextResponse(
            JSON.stringify({message: 'Something went wrong!'}, {status: 500})
        )
    }
}

export const DELETE = async (req) => {

    try {

        const data = await req.json()

        const category = await prisma.category.delete({
            where: {
                id: data.id
            }
        });

        return new NextResponse(
            JSON.stringify(category, {status: 200})
        )

    } catch (err){
        console.log(err)
        return new NextResponse(
            JSON.stringify({message: 'Something went wrong!'}, {status: 500})
        )
    }
}