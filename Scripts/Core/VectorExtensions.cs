using System;

namespace Godot
{
    // Расширяем сам Vector2 нативными методами приведения к Vector3
    public static class VectorExtensions
    {
        public static Vector3 To3D(this Vector2 v) => new Vector3(v.X, v.Y, 0);
        public static Vector2 To2D(this Vector3 v) => new Vector2(v.X, v.Y);
    }
}
